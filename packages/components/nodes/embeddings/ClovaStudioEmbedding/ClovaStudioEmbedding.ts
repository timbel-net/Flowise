import { ClovaStudioEmbeddings, ClovaStudioEmbeddingsParams } from './clovaStudioEmbeddings'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { OpenAIEmbeddingsParams } from '@langchain/openai'

class ClovaStudioEmbedding_Embeddings implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'ClovaStudio Embeddings'
        this.name = 'clovaStudioEmbeddings'
        this.version = 2.0
        this.type = 'ClovaStudioEmbeddings'
        this.icon = 'clova-studio.svg'
        this.category = 'Embeddings'
        this.description = 'ClovaStudio API to run vectorize job for text to numbers.'
        this.baseClasses = [this.type, ...getBaseClasses(ClovaStudioEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['clovaStudioApi']
        }
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [
                    {
                        label: 'clir-emb-dolphin',
                        name: 'clir-emb-dolphin'
                    },
                    {
                        label: 'clir-sts-dolphin',
                        name: 'clir-sts-dolphin'
                    }
                ],
                default: 'clir-emb-dolphin'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const modelName = nodeData.inputs?.modelName as string
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const obj: Partial<OpenAIEmbeddingsParams> & { [key: string]: string } = {
            modelName,
            ...credentialData
        }

        const model = new ClovaStudioEmbeddings(obj)
        return model
    }
}

module.exports = { nodeClass: ClovaStudioEmbedding_Embeddings }
