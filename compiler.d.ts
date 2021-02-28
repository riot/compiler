import {RawSourceMap} from 'source-map'

export type CompilerOptions = {
    template?: string
    file?: string
    scopedCss?: boolean
}

export type CompilerOutput = {
    code: string
    map: RawSourceMap
}

export type CompilerOutputFragments = {
    template: object
    css: object
    javascript: object
}

export type PreProcessorOutput = {
    code: string,
    map?: RawSourceMap
}

export type PreProcessorMeta = {
    tagName: string,
    fragments: CompilerOutputFragments,
    options: CompilerOptions,
    source: string
}

export type ProcessorFunction = (code: string, meta: PreProcessorMeta) => PreProcessorOutput

export type PreProcessorsMap = {
    template: Map<string, ProcessorFunction>
    javascript: Map<string, ProcessorFunction>
    css: Map<string, ProcessorFunction>
}

export type PostProcessorsMap =  Map<string, ProcessorFunction>
export type PreProcessorType = 'template' | 'javascript' | 'css'

// public API
export function compile(source: string, options?: CompilerOptions): CompilerOutput
export function registerPreprocessor(
    type: PreProcessorType,
    name: string,
    fn: ProcessorFunction
): PreProcessorsMap
export function registerPostprocessor( fn: ProcessorFunction): PostProcessorsMap
