import { z } from 'zod'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { DynamicTool } from '@langchain/core/tools'
import { BaseRetriever } from '@langchain/core/retrievers'
import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { SOURCE_DOCUMENTS_PREFIX } from '../../../src/agents'

class AIKMSRetriever_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = '지식모델 검색기(Retriever)'
        this.name = 'aikmsRetrieverTool'
        this.version = 0.1
        this.type = 'AIKMSRetrieverTool'
        this.icon = 'aikms.svg'
        this.category = 'Tools'
        this.description = 'Langsa 의 AI KMS 의 지식 모델을 이용한 검색 도구 입니다.'
        this.baseClasses = [this.type, 'DynamicTool', ...getBaseClasses(DynamicTool)]
        this.inputs = [
            // {
            //     label: 'Retriever Description',
            //     name: 'description',
            //     type: 'string',
            //     description: 'When should agent uses to retrieve documents',
            //     rows: 3,
            //     placeholder: 'Searches and returns documents regarding the state-of-the-union.'
            // },
            {
                label: 'Retriever',
                name: 'retriever',
                type: 'BaseRetriever'
            },
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const name = nodeData.inputs?.name || 'AIKMS 지식 모델'
        const description = nodeData.inputs?.description || ''
        const retriever = nodeData.inputs?.retriever as BaseRetriever
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments as boolean

        const input = {
            name,
            description
        }

        const func = async ({ input }: { input: string }, runManager?: CallbackManagerForToolRun) => {
            const docs = await retriever.getRelevantDocuments(input, runManager?.getChild('retriever'))
            const content = docs.map((doc) => doc.pageContent).join('\n\n')
            const sourceDocuments = JSON.stringify(docs)
            return returnSourceDocuments ? content + SOURCE_DOCUMENTS_PREFIX + sourceDocuments : content
        }

        const schema = z.object({
            input: z.string().describe('query to look up in retriever')
        })

        const tool = new DynamicStructuredTool({ ...input, func, schema })
        return tool
    }
}

module.exports = { nodeClass: AIKMSRetriever_Tools }
