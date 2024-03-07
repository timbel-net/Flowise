import { INodeParams, INodeCredential } from '../src/Interface'

class ClovaStudioCredential implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'ClovaStudio API'
        this.name = 'clovaStudioApi'
        this.version = 1.0
        this.description = 'You can not get your API key officially. Only me can get it.'
        this.inputs = [
            {
                label: 'ClovaStudio API Key',
                name: 'clovaStudioKey',
                type: 'password'
            },
            {
                label: 'ClovaStudio Gateway API Key',
                name: 'clovaStudioGwKey',
                type: 'password'
            },
            {
                label: 'ClovaStudio Request ID',
                name: 'clovaStudioRequestId',
                type: 'string',
                optional: true
            }
        ]
    }
}

module.exports = { credClass: ClovaStudioCredential }
