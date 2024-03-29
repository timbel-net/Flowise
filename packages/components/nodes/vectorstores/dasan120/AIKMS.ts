import { Document } from '@langchain/core/documents'
import { Milvus, MilvusLibArgs } from '@langchain/community/vectorstores/milvus'
import { Embeddings } from '@langchain/core/embeddings'
import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'

class Dasan120_VectorStores implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    badge: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = '다산콜센터'
        this.name = 'dasan120'
        this.version = 0.1
        this.type = 'dasan120'
        this.icon = 'langsa.svg'
        this.category = 'Vector Stores'
        this.description = `다산120 콜센터에서 제공하는 모든 지식 정보를 가지고 있습니다.`
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.badge = 'Super Ultra Smart'
        this.inputs = [
            {
                label: 'URL',
                name: 'url',
                type: 'string',
                placeholder: 'https://dev.langsa.ai',
                default: 'https://dev.langsa.ai/vector-store-gateway/chunks/search'
            }
        ]
        this.outputs = [
            {
                label: 'Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const url = nodeData.inputs?.url as string
        return url
    }
}

module.exports = { nodeClass: Dasan120_VectorStores }
