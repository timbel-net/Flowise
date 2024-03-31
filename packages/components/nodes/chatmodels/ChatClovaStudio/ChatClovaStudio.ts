import { BaseCache } from '@langchain/core/caches'
import { ChatClovaStudio } from './chatclova'
import { ClovaStudioInputs } from '../../llms/ClovaStudio/clova'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData } from '../../../src/utils'

class ChatClovaStudio_ChatModels implements INode {
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
        this.label = 'Chat HyperCLOVA X'
        this.name = 'chatHyperClovaX'
        this.version = 0.1
        this.type = 'ChatHyperCLOVA_X'
        this.icon = 'clova-studio.svg'
        this.category = 'Chat Models'
        this.description =
            '대화형 엔드포인트를 사용하는 맞춤 모델을 만드는 데 도움이 되는 AI 개발 도구 AI development tools to help create custom models that use the Chat endpoint'
        this.baseClasses = [this.type, ...getBaseClasses(ChatClovaStudio)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['clovaStudioApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                default: 'HCX-003'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                description:
                    'What sampling temperature to use, between 0.0 and 1.0. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
                step: 0.1,
                default: 0.5,
                optional: true
            },
            {
                label: 'Max Output Tokens',
                name: 'maxOutputTokens',
                type: 'number',
                description: 'The maximum number of tokens to generate in the completion.',
                step: 1,
                default: 256,
                optional: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                description:
                    'Nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
                step: 0.1,
                default: 0.8,
                optional: true
            },
            {
                label: 'Repetition Penalty',
                name: 'repetitionPenalty',
                type: 'number',
                description: 'Penalty for repeated words in generated text (minimum: 0; maximum: 10)',
                step: 0.01,
                default: 5,
                optional: true
            },
            {
                label: 'Top Probability',
                name: 'topK',
                type: 'number',
                description:
                    'Nucleus sampling, where the model considers the results of the tokens with top_k probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
                step: 1,
                default: 0,
                additionalParams: true,
                optional: true
            },
            {
                label: 'Random Seed',
                name: 'randomSeed',
                type: 'number',
                description: 'The seed to use for random sampling. If set, different calls will generate deterministic results.',
                step: 1,
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const modelName = nodeData.inputs?.modelName as string
        const temperature = nodeData.inputs?.temperature as string
        const maxOutputTokens = nodeData.inputs?.maxOutputTokens as string
        const topP = nodeData.inputs?.topP as string
        const repetitionPenalty = nodeData.inputs?.repetitionPenalty as string
        const cache = nodeData.inputs?.cache as BaseCache

        const obj: ClovaStudioInputs = {
            apiKey: credentialData.clovaStudioKey,
            apiGatewayKey: credentialData.clovaStudioGwKey,
            requestId: credentialData.clovaStudioRequestId,
            model: modelName
        }

        if (maxOutputTokens) obj.maxTokens = parseInt(maxOutputTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (repetitionPenalty) obj.repetitionPenalty = parseFloat(repetitionPenalty)
        if (cache) obj.cache = cache
        if (temperature) obj.temperature = parseFloat(temperature)

        return new ChatClovaStudio(obj)
    }
}

module.exports = { nodeClass: ChatClovaStudio_ChatModels }
