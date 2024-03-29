// import { type ClientOptions, OpenAI as OpenAIClient } from 'openai'
import { Embeddings, type EmbeddingsParams } from '@langchain/core/embeddings'
// import { AzureOpenAIInput, OpenAICoreRequestOptions } from './types.js'
// import { getEndpoint, OpenAIEndpointConfig } from './utils/azure.js'
// import { wrapOpenAIClientError } from './utils/openai.js'

const clovaStudioEmbeddingURL =
    'https://clovastudio.apigw.ntruss.com/testapp/v1/api-tools/embedding/{model}/b11f9acef09942fca5661d09d6c574b0'

export interface ClovaStudioEmbeddingsParams extends EmbeddingsParams {
    modelName: string
}

export class ClovaStudioEmbeddings extends Embeddings implements ClovaStudioEmbeddingsParams {
    modelName = 'clir-emb-dolphin'

    apiKey: string

    apiGatewayKey: string

    requestId: string

    constructor(fields?: Partial<ClovaStudioEmbeddingsParams>) {
        const fieldsWithDefaults = { ...fields }
        super(fieldsWithDefaults)
    }

    // eslint-disable-next-line unused-imports/no-unused-vars
    async embedDocuments(texts: string[]): Promise<number[][]> {
        return [[]] as number[][]
    }

    async embedQuery(text: string): Promise<number[]> {
        const response = await fetch(clovaStudioEmbeddingURL.replace('{model}', this.modelName), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-NCP-CLOVASTUDIO-API-KEY': this.apiKey,
                'X-NCP-APIGW-API-KEY': this.apiGatewayKey,
                'X-NCP-CLOVASTUDIO-REQUEST-ID': this.requestId
            },
            body: JSON.stringify({ text })
        })

        const { result: embedding } = await response.json()
        return embedding
    }
}
