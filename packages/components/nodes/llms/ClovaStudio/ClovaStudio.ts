import { BaseCache } from '@langchain/core/caches'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData } from '../../../src/utils'
import { ClovaStudio, ClovaStudioInputs } from './clova'

class ClovaStudio_LLMs implements INode {
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
        this.label = 'Clova Studio'
        this.name = 'clovaStudio'
        this.version = 0.1
        this.type = 'ClovaStudio LLM'
        this.icon = 'clova-studio.svg'
        this.category = 'LLMs'
        this.description = 'AI development tools to help create custom models'
        this.baseClasses = [this.type, ...getBaseClasses(ClovaStudio)]
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
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Output Tokens',
                name: 'maxOutputTokens',
                type: 'number',
                description: 'The maximum number of tokens to generate in the completion.',
                step: 1,
                default: 256,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                description:
                    'Nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
                step: 0.1,
                default: 0.8,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Repetition Penalty',
                name: 'repetitionPenalty',
                type: 'number',
                description: 'Penalty for repeated words in generated text (minimum: 0; maximum: 10)',
                step: 0.01,
                default: 5,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topK',
                type: 'number',
                description:
                    'Nucleus sampling, where the model considers the results of the tokens with top_k probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
                step: 1,
                default: 0,
                optional: true,
                additionalParams: true
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

        return new ClovaStudio(obj)
    }
}

module.exports = { nodeClass: ClovaStudio_LLMs }
