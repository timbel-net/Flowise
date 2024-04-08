import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import { AIMessageChunk, BaseMessage } from '@langchain/core/messages'
import { ChatGeneration, ChatGenerationChunk, ChatResult } from '@langchain/core/outputs'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { API_URL, ClovaStudioInputs } from '../../llms/ClovaStudio/clova'
import { type BaseLanguageModelCallOptions } from '@langchain/core/language_models/base'

interface ParsedMessage {
    role: string
    content: string
}

function _parseChatHistory(history: BaseMessage[]): [ParsedMessage[], string] {
    const chatHistory: ParsedMessage[] = []
    let instruction = ''

    for (const message of history) {
        if (typeof message.content !== 'string') {
            throw new Error('Clova Studio support only string message.')
        }
        if ('content' in message) {
            instruction = message.content
        }
    }

    return [chatHistory, instruction]
}

export class ChatClovaStudio<
    CallOptions extends BaseLanguageModelCallOptions = BaseLanguageModelCallOptions
> extends BaseChatModel<CallOptions> {
    temperature = 0.5

    maxTokens = 256

    topP = 0.8

    repetitionPenalty = 5

    model = 'HCX-003'

    apiKey: string

    apiGatewayKey: string

    requestId: string

    constructor(config?: ClovaStudioInputs) {
        super(config ?? {})

        const apiKey = config?.apiKey ?? getEnvironmentVariable('CLOVA_API_KEY')
        const apiGatewayKey = config?.apiGatewayKey ?? getEnvironmentVariable('CLOVA_API_GW_KEY')
        const requestId = config?.requestId ?? getEnvironmentVariable('CLOVA_REQUEST_ID')

        if (!apiKey || !apiGatewayKey || !requestId) {
            throw new Error('Please set the CLOVA_API_KEY and CLOVA_API_GW_KEY environment variable or pass it to the constructor.')
        }

        this.apiKey = apiKey
        this.apiGatewayKey = apiGatewayKey
        this.requestId = requestId
        if (config?.model) this.model = config?.model
        if (config?.maxTokens) this.maxTokens = config?.maxTokens
        if (config?.temperature) this.temperature = config?.temperature
        if (config?.topP) this.topP = config?.topP
        if (config?.repetitionPenalty) this.repetitionPenalty = config?.repetitionPenalty
    }

    _llmType() {
        return 'hyperClovaX'
    }

    _combineLLMOutput?() {
        return {}
    }

    /** @ignore */
    async _generate(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        runManager: CallbackManagerForLLMRun | undefined
    ): Promise<ChatResult> {
        let finalChunk: ChatGenerationChunk | undefined
        let inputLength = 0
        let outputLength = 0

        const stream = this._streamResponseChunks(messages, options, runManager)
        for await (const chunk of stream) {
            finalChunk = chunk
        }

        const generations: ChatGeneration[] = []
        if (finalChunk) {
            generations.push({
                text: finalChunk?.text,
                message: finalChunk?.message.toChunk()
            })

            inputLength = finalChunk.message.additional_kwargs?.inputLength as number
            outputLength = finalChunk.message.additional_kwargs?.outputLength as number
        }

        return {
            generations,
            llmOutput: {
                estimatedTokenUsage: {
                    promptTokens: inputLength,
                    completionTokens: outputLength,
                    totalTokens: inputLength + outputLength
                }
            }
        }
    }

    async *_streamResponseChunks(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        runManager?: CallbackManagerForLLMRun
    ): AsyncGenerator<ChatGenerationChunk> {
        const [messageHistory, instruction] = _parseChatHistory(messages)

        const newTokenIndices = {
            prompt: 0,
            completion: 0
        }

        const streamIterable = await this.completionWithRetry(messageHistory, instruction, options)
        for await (const chunk of streamIterable) {
            const text = chunk.content.toString()
            yield new ChatGenerationChunk({
                message: chunk.toChunk(),
                text
            })

            if (!Object.keys(chunk.additional_kwargs).length) {
                // eslint-disable-next-line no-void
                void runManager?.handleLLMNewToken(text, newTokenIndices, undefined, undefined, undefined, {
                    chunk
                })
            }
        }

        if (options.signal?.aborted) {
            throw new Error('AbortError')
        }
    }

    async completionWithRetry(history: any, instruction: any, options: any): Promise<AsyncIterable<AIMessageChunk>> {
        const body = JSON.stringify({
            messages: [
                ...history,
                {
                    role: 'user',
                    content: instruction
                }
            ],
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            topP: this.topP,
            repetitionPenalty: this.repetitionPenalty,
            stopBefore: [],
            includeAiFilters: true,
            topK: 0,
            seed: 0
        })

        const response = await fetch(`${API_URL}/${this.model}`, {
            method: 'POST',
            headers: {
                Accept: 'text/event-stream',
                'Content-Type': 'application/json',
                'X-NCP-CLOVASTUDIO-API-KEY': this.apiKey,
                'X-NCP-APIGW-API-KEY': this.apiGatewayKey,
                'X-NCP-CLOVASTUDIO-REQUEST-ID': this.requestId
            },
            signal: options?.signal,
            body
        })

        const decoder = new TextDecoder()
        const reader = response.body?.getReader()

        return this.caller.call(async () => {
            try {
                return {
                    async *[Symbol.asyncIterator]() {
                        let read
                        let text: string = ''

                        while ((read = await reader?.read())) {
                            const { value, done } = read

                            if (done) {
                                options?.signal?.abort('end_of_stream')
                                break
                            }

                            text += decoder.decode(value)
                            if (!text.endsWith('}\n\n')) {
                                continue
                            }

                            try {
                                const data = JSON.parse(text.slice(text.indexOf('data:{') + 5, text.indexOf('}\n\n') + 1))

                                if (text.includes('event:result')) {
                                    yield new AIMessageChunk({
                                        content: data.message.content,
                                        additional_kwargs: {
                                            inputLength: data.inputLength,
                                            outputLength: data.outputLength
                                        }
                                    })

                                    options?.signal?.abort('stop_before')
                                    break
                                } else if (data?.message?.content) {
                                    yield new AIMessageChunk({ content: data.message.content })
                                }
                            } catch (e) {
                                console.error(e, text)
                            }

                            text = ''
                        }
                    }
                }
            } catch (e) {
                console.error('clova fetch error', e)
                throw e
            }
        })
    }
}
