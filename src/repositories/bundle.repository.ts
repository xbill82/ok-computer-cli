import {
  Client,
  type DataSourceObjectResponse,
  type PageObjectResponse,
  type PartialDataSourceObjectResponse,
  type PartialPageObjectResponse,
} from '@notionhq/client'

import {getConfig} from '../services/config.js'

const config = getConfig()
const notionConfig = config.notion as Record<string, unknown>
const notion = new Client({
  auth: notionConfig.apiToken as string,
})

export class Bundle {
  estimatedDays: number
  exceeded: boolean
  id: string
  name: string
  startDate: Date
  private _spentDays: number

  constructor(page: PageObjectResponse | PartialPageObjectResponse) {
    if (!('properties' in page)) {
      throw new Error('Page properties are not available')
    }

    this.id = page.id

    const {properties} = page

    const titleProperty = properties.Name
    const estimatedDaysProperty = properties['Estimation (days)']
    const exceededProperty = properties.Exceeded
    const spentDaysProperty = properties['Time spent (days)']
    const startDateProperty = properties['Start date']

    this.estimatedDays =
      estimatedDaysProperty && 'number' in estimatedDaysProperty && estimatedDaysProperty.number
        ? estimatedDaysProperty.number
        : 0
    this.exceeded =
      exceededProperty && 'checkbox' in exceededProperty && exceededProperty.checkbox
        ? exceededProperty.checkbox
        : false
    this.name =
      titleProperty && 'title' in titleProperty && titleProperty.title[0]?.plain_text
        ? titleProperty.title[0].plain_text
        : ''
    this.startDate =
      startDateProperty && 'date' in startDateProperty && startDateProperty.date?.start
        ? new Date(startDateProperty.date.start)
        : new Date()
    this._spentDays =
      spentDaysProperty && 'number' in spentDaysProperty && spentDaysProperty.number ? spentDaysProperty.number : 0
  }

  get spentDays(): number {
    return this._spentDays
  }

  set spentDays(value: number) {
    this._spentDays = value
    this.exceeded = value > this.estimatedDays
  }

  toString(): string {
    return `Bundle(name: ${this.name}, spentDays: ${this._spentDays}, estimatedDays: ${this.estimatedDays}, exceeded: ${this.exceeded})`
  }
}

function isPage(
  result: DataSourceObjectResponse | PageObjectResponse | PartialDataSourceObjectResponse | PartialPageObjectResponse,
): result is PageObjectResponse | PartialPageObjectResponse {
  return result.object === 'page'
}

export async function getBundleByName(name: string): Promise<Bundle> {
  const response = await notion.dataSources.query({
    // eslint-disable-next-line camelcase
    data_source_id: notionConfig.bundlesDbId as string,
    filter: {
      property: 'title',
      title: {
        equals: name,
      },
    },
  })

  const page = response.results.find((result) => isPage(result))
  if (!page) {
    throw new Error(`Bundle with name ${name} not found`)
  }

  return new Bundle(page)
}

export interface GetAllBundlesOptions {
  page_size?: number
  sorts?: Array<{
    direction: 'ascending' | 'descending'
    property: string
  }>
  start_cursor?: string
}

export interface GetAllBundlesResult {
  bundles: Bundle[]
  has_more: boolean
  next_cursor: null | string
}

type StatusEnum = "Won't Do" | 'Completed' | 'In Progress' | 'Not Started'

export async function getAllBundlesByStatus(
  status: StatusEnum,
  options: GetAllBundlesOptions = {},
): Promise<GetAllBundlesResult> {
  // eslint-disable-next-line camelcase
  const {page_size, sorts, start_cursor} = options

  const response = await notion.dataSources.query({
    // eslint-disable-next-line camelcase
    data_source_id: notionConfig.bundlesDbId as string,
    // eslint-disable-next-line camelcase
    ...(page_size && {page_size}),
    filter: {
      property: 'Status',
      status: {
        equals: status,
      },
    },
    ...(sorts && {sorts}),
    // eslint-disable-next-line camelcase
    ...(start_cursor && {start_cursor}),
  })

  const pages = response.results.filter((result) => isPage(result)) as (
    | PageObjectResponse
    | PartialPageObjectResponse
  )[]
  const bundles = pages.map((page) => new Bundle(page))

  return {
    bundles,
    // eslint-disable-next-line camelcase
    has_more: response.has_more ?? false,
    // eslint-disable-next-line camelcase
    next_cursor: response.next_cursor ?? null,
  }
}

export async function saveBundle(bundle: Bundle): Promise<void> {
  await notion.pages.update({
    // eslint-disable-next-line camelcase
    page_id: bundle.id,
    properties: {
      'Estimation (days)': {
        number: bundle.estimatedDays,
      },
      Exceeded: {
        checkbox: bundle.exceeded,
      },
      Name: {
        title: [
          {
            text: {
              content: bundle.name,
            },
          },
        ],
      },
      'Start date': {
        date: {
          start: bundle.startDate.toISOString().split('T')[0],
        },
      },
      'Time spent (days)': {
        number: bundle.spentDays,
      },
    },
  })
}
