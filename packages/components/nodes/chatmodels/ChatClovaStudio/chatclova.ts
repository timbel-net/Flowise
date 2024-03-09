import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import { AIMessage, BaseMessage } from '@langchain/core/messages'
import { ChatGeneration, ChatResult } from '@langchain/core/outputs'
import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { API_URL, ClovaStudioInputs } from '../../llms/ClovaStudio/clova'

interface ParsedMessage {
    role: string
    content: string
}

const responseData = {
    message: {
        role: 'assistant',
        content: '네. 무엇을 도와드릴까요?'
    },
    inputLength: 2,
    outputLength: 10,
    stopReason: 'stop_before',
    seed: 650435647,
    aiFilter: [
        {
            groupName: 'curse',
            name: 'insult',
            score: '2'
        },
        {
            groupName: 'curse',
            name: 'discrimination',
            score: '2'
        },
        {
            groupName: 'unsafeContents',
            name: 'sexualHarassment',
            score: '2'
        }
    ]
}
export type ParsedResult = typeof responseData

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

export class ChatClovaStudio extends BaseChatModel {
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
        return 'clovaStudio'
    }

    _combineLLMOutput?() {
        return {}
    }

    /** @ignore */
    async _generate(
        messages: BaseMessage[],
        options: this['ParsedCallOptions'],
        _?: CallbackManagerForLLMRun | undefined
    ): Promise<ChatResult> {
        const [messageHistory, instruction] = _parseChatHistory(messages)

        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-NCP-CLOVASTUDIO-API-KEY': this.apiKey,
            'X-NCP-APIGW-API-KEY': this.apiGatewayKey,
            'X-NCP-CLOVASTUDIO-REQUEST-ID': this.requestId
        }

        const body = JSON.stringify({
            messages: [
                ...messageHistory,
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
            headers,
            body
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch ${API_URL}/${this.model} from Clova Studio: ${response.status}`)
        }

        const json = await response.json()
        const { message, inputLength, outputLength } = json.result as ParsedResult
        const totalTokens = inputLength + outputLength
        const generations: ChatGeneration[] = [{ text: message.content, message: new AIMessage(message.content) }]

        return {
            generations,
            llmOutput: { totalTokens }
        }
    }
}
