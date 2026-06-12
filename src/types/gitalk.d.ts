declare module 'gitalk/dist/gitalk.css'

declare module 'gitalk' {
  export interface GitalkOptions {
    clientID: string
    clientSecret?: string
    repo: string
    owner: string
    admin: string[]
    id: string
    title?: string
    body?: string
    labels?: string[]
    language?: string
    distractionFreeMode?: boolean
    proxy?: string
    createIssueManually?: boolean
    pagerDirection?: 'last' | 'first'
    enableHotKey?: boolean
  }

  export default class Gitalk {
    constructor(options: GitalkOptions)
    render(container: string | HTMLElement): void
  }
}
