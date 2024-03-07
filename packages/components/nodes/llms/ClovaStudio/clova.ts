import { BaseLLMParams, LLM } from '@langchain/core/language_models/llms'

export const API_URL = 'https://clovastudio.stream.ntruss.com/testapp/v1/chat-completions'

export interface ClovaStudioInputs extends BaseLLMParams {
    /**
     * What sampling temperature to use.
     * Should be a double number between 0 (inclusive) and 1 (inclusive).
     */
    temperature?: number

    /**
     * Maximum limit on the total number of tokens
     * used for both the input prompt and the generated response.
     */
    maxTokens?: number

    topP?: number

    repetitionPenalty?: number

    /** Model name to use. */
    model?: string

    /** Clova Studio API Key. */
    apiKey: string

    /** Clova Studio API Gateway Key. */
    apiGatewayKey: string

    requestId?: string
}

export class ClovaStudio extends LLM implements ClovaStudioInputs {
    lc_serializable = true

    temperature = 0.5

    repeatPenalty = 5

    topP = 0.8

    topK = 0

    maxTokens = 256

    model = 'HCX-003'

    apiKey: string

    apiGatewayKey: string

    requestId: string

    constructor(config?: ClovaStudioInputs) {
        super(config ?? {})

        const apiKey = config?.apiKey
        const apiGatewayKey = config?.apiGatewayKey

        if (!apiKey || !apiGatewayKey) {
            throw new Error('Please set the CLOVA_API_KEY and CLOVA_API_GW_KEY environment variable or pass it to the constructor.')
        }

        this.apiKey = apiKey
        this.apiGatewayKey = apiGatewayKey
        this.requestId = config?.requestId ?? ''
        this.model = config?.model ?? this.model
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            apiKey: 'CLOVA_API_KEY',
            apiGatewayKey: 'CLOVA_API_GW_KEY',
            requestId: 'CLOVA_REQUEST_ID'
        }
    }

    static lc_name() {
        return 'Clova Studio'
    }

    _llmType() {
        return 'clovaStudio'
    }

    /** @ignore */
    async _call(prompt: string, options: this['ParsedCallOptions']): Promise<string> {
        return this.caller.callWithOptions({ signal: options.signal }, async () => {
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-NCP-CLOVASTUDIO-API-KEY': this.apiKey,
                'X-NCP-APIGW-API-KEY': this.apiGatewayKey,
                'X-NCP-CLOVASTUDIO-REQUEST-ID': this.requestId
            }

            const body = JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                topP: this.topP,
                topK: this.topK,
                maxTokens: this.maxTokens,
                temperature: this.temperature,
                repeatPenalty: this.repeatPenalty,
                stopBefore: [],
                includeAiFilters: true,
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
            const {
                message: { content }
            } = json.result

            return content
        })
    }
}
