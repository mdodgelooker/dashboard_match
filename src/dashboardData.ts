import { Looker40SDK } from '@looker/sdk'
import type { IDashboardElement } from '@looker/sdk'
import { embedText, generateText } from './api'
import pReduce from 'p-reduce'

export const DASHBOARD_STORAGE_KEY = 'dashboard-data-for-embeddings'

const getAllDashboardId = async (sdk: Looker40SDK): Promise<string[]> => {
  try {
    const dashboards = await sdk.ok(sdk.all_dashboards('id,folder'))
    return dashboards
      .filter(({ folder }) => !folder?.is_personal)
      .map(({ id }) => id || '')
  } catch (error) {
    return []
  }
}

export interface DashboardMetadata {
  dashboardId: string
  title?: string | null
  description?: string | null
}

const getDashboardMetadata = async (
  sdk: Looker40SDK,
  dashboardId: string
): Promise<DashboardMetadata | undefined> => {
  try {
    const dashboard = await sdk.ok(sdk.dashboard(dashboardId))
    return {
      dashboardId: dashboard.id || dashboardId,
      title: dashboard.title,
      description: dashboard.description,
    }
  } catch (error) {
    return undefined
  }
}

const extractFilterables = (dashboardElementMetadata: IDashboardElement) => {
  const filterables = []
  if (dashboardElementMetadata.result_maker) {
    const listeners =
      dashboardElementMetadata.result_maker.filterables?.[0].listen
    if (listeners) {
      for (const filter of listeners) {
        filterables.push(filter.dashboard_filter_name)
      }
    }
  }
  return filterables
}

const extractTextFromBodyText = (bodyText: string) => {
  const response = []
  if (bodyText) {
    try {
      for (const text of JSON.parse(bodyText)) {
        const r = text.get('children')[0].get('text')
        response.push(r)
      }
    } catch (e) {
      console.warn('xx')
    }
  }
  return response.filter((x) => {
    return x.length > 0
  })
}

const getLookerDashboardElements = async (
  sdk: Looker40SDK,
  dashboardId: string
) => {
  try {
    const resp = await sdk.ok(sdk.dashboard_dashboard_elements(dashboardId))
    return resp
  } catch (error) {
    return []
  }
}

export interface DashboardElementMetadata {
  dashboardId: string
  bodyText: any[]
  noteText?: string | null
  subtitleText?: string | null
  elementTitle?: string | null
  filterables: Array<string | null | undefined>
}

const getDashboardElementMetadata = async (
  sdk: Looker40SDK,
  dashboardId: string
): Promise<DashboardElementMetadata[]> => {
  const dashElements = await getLookerDashboardElements(sdk, dashboardId)
  console.log(dashElements)

  return dashElements.map((dashElement) => ({
    dashboardId: dashboardId,
    bodyText: dashElement.body_text
      ? extractTextFromBodyText(dashElement.body_text)
      : [],
    noteText: dashElement.note_text,
    subtitleText: dashElement.subtitle_text,
    elementTitle: dashElement.title,
    filterables: extractFilterables(dashElement),
  }))
}

export interface MetaData extends DashboardMetadata {
  elements: DashboardElementMetadata[]
}

const getDashboardAndElementMetadata = async (
  sdk: Looker40SDK,
  id: string
): Promise<MetaData | undefined> => {
  const dashboardMetadata = await getDashboardMetadata(sdk, id)
  if (dashboardMetadata) {
    const elementMetadata = await getDashboardElementMetadata(sdk, id)
    return { ...dashboardMetadata, elements: elementMetadata }
  }
  return undefined
}

export interface StoredEmbedding {
  id: string
  embedding: number[]
  metadata: MetaData
}

const getDashboardEmbedding = async (
  sdk: Looker40SDK,
  id: string
): Promise<StoredEmbedding | undefined> => {
  const data = await getDashboardAndElementMetadata(sdk, id)
  if (data) {
    const result = await embedText(JSON.stringify(data))
    if (typeof result !== 'string') {
      if (result?.embedding.value) {
        return { id, embedding: result.embedding.value, metadata: data }
      }
    }
  }
  return undefined
}

export const loadDashboardEmbeddings = async (sdk: Looker40SDK) => {
  const cachedEmbeddings = localStorage.getItem(DASHBOARD_STORAGE_KEY)
  if (cachedEmbeddings) {
    return JSON.parse(cachedEmbeddings)
  }
  const allDashboardId = await getAllDashboardId(sdk)
  const dashboardEmbeddings = await pReduce(
    allDashboardId,
    async (acc: StoredEmbedding[], id) => {
      const result = await getDashboardEmbedding(sdk, id)
      if (result) {
        acc.push(result)
      }
      return acc
    },
    []
  )
  localStorage.setItem(
    DASHBOARD_STORAGE_KEY,
    JSON.stringify(dashboardEmbeddings)
  )
  return dashboardEmbeddings
}

export type GetMatchingDashboardsProps = {
  query: string
  embeddings: StoredEmbedding[]
  top: number
}

const cosineSimilarity = (A: number[], B: number[]) => {
  let dotproduct = 0
  let mA = 0
  let mB = 0

  for (let i = 0; i < A.length; i++) {
    dotproduct += A[i] * B[i]
    mA += A[i] * A[i]
    mB += B[i] * B[i]
  }

  mA = Math.sqrt(mA)
  mB = Math.sqrt(mB)
  const similarity = dotproduct / (mA * mB)

  return similarity
}

const getSummary = async (metadata: MetaData) => {
  const prompt = `${JSON.stringify(metadata)}
  Summarize this data in one sentence:
  `
  const result = await generateText(prompt)
  console.log(result)
  return result.candidates[0].output
}

export interface Similarity extends Omit<StoredEmbedding, 'embedding'> {
  similarity: number
  summary?: string
}

export const getMatchingDashboards = async ({
  query,
  embeddings,
  top,
}: GetMatchingDashboardsProps): Promise<Similarity[] | string> => {
  const queryEmbeddingResult = await embedText(query)
  if (typeof queryEmbeddingResult === 'string') {
    return 'Failed to get matching dashboards'
  }
  const {
    embedding: { value: queryEmbedding },
  } = queryEmbeddingResult
  const similarities = embeddings.map(({ id, embedding, metadata }) => {
    const similarity = cosineSimilarity(queryEmbedding, embedding)
    return { id, metadata, similarity }
  })
  similarities.sort((a, b) => b.similarity - a.similarity)
  return Promise.all(
    similarities.slice(0, top).map(async (item) => {
      const summary = await getSummary(item.metadata)
      return { ...item, summary }
    })
  )
}
