import { Embeddings, type EmbeddingsParams } from '@langchain/core/embeddings'

const clovaStudioEmbeddingURL =
    'https://clovastudio.apigw.ntruss.com/testapp/v1/api-tools/embedding/{model}/b11f9acef09942fca5661d09d6c574b0'

export interface ClovaStudioEmbeddingsParams extends EmbeddingsParams {
    modelName: string
    apiKey: string
    apiGatewayKey: string
    requestId: string
}

export class ClovaStudioEmbeddings extends Embeddings implements ClovaStudioEmbeddingsParams {
    modelName = 'clir-emb-dolphin'

    apiKey: string

    apiGatewayKey: string

    requestId: string

    constructor(fields?: Partial<ClovaStudioEmbeddingsParams> & { [key: string]: string }) {
        super({ ...fields })
        this.apiKey = fields?.clovaStudioKey ?? ''
        this.apiGatewayKey = fields?.clovaStudioGwKey ?? ''
        this.requestId = fields?.clovaStudioRequestId ?? ''
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

        const {
            result: { embedding }
        } = await response.json()

        return embedding
    }
}
