/*

 MIT License

 Copyright (c) 2021 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

import React, { useContext, useEffect, useReducer } from 'react'
import { hot } from 'react-hot-loader/root'
import {
  Box,
  Button,
  MessageBar,
  Header,
  Page,
  Space,
  SpaceVertical,
  ProgressCircular,
  FieldText,
} from '@looker/components'
import { ExtensionContext } from '@looker/extension-sdk-react'
import type { ChangeEvent } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { DashboardList } from './DashboardList'
import { DashboardEmbed } from './DashboardEmbed'
import { reducer, initialState } from './state'
import { loadDashboardEmbeddings, getMatchingDashboards } from './dashboardData'

const AppInternal = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const {
    loadingEmbeddings,
    embeddings,
    query,
    loadingMatches,
    selectedDashboardId,
    matches,
    errorMessage,
  } = state

  const { core40SDK } = useContext(ExtensionContext)

  useEffect(() => {
    dispatch({
      type: 'EMBEDDINGS_LOAD',
    })
    const loadEmbeddings = async () => {
      try {
        const result = await loadDashboardEmbeddings(core40SDK)
        dispatch({
          type: 'EMBEDDINGS_READY',
          payload: { embeddings: result },
        })
      } catch (error) {
        dispatch({
          type: 'EMBEDDINGS_FAIL',
        })
      }
    }
    loadEmbeddings()
  }, [core40SDK])

  const { pathname } = useLocation()
  const history = useHistory()
  useEffect(() => {
    if (matches && matches.length > 0) {
      // Get the dashboard ID from the location
      const path: string[] = pathname.split('/')
      let id: string | undefined
      if (path.length > 1 && path[1] !== '') {
        id = path[1]
      }
      if (id && id !== selectedDashboardId) {
        dispatch({ payload: { selectedDashboardId: id }, type: 'SET_STATE' })
      }
    }
  }, [matches, history, pathname, selectedDashboardId])

  const onDashboardSelected = (id: string) => {
    if (!selectedDashboardId || selectedDashboardId !== id) {
      // Update the id in the URL. This will trigger the useEffects
      // which will load the dashboard
      history.push('/' + id)
    }
  }

  if (loadingEmbeddings)
    return (
      <Box p="large" display="flex" justifyContent="center" alignItems="center">
        <ProgressCircular size="large" />
      </Box>
    )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_STATE',
      payload: { query: e.currentTarget.value },
    })
  }

  const handleSubmit = async () => {
    dispatch({ type: 'MATCHES_LOAD' })
    const matches = await getMatchingDashboards({ query, embeddings, top: 3 })
    if (typeof matches !== 'string') {
      dispatch({ type: 'MATCHES_COMPLETE', payload: { matches } })
    }
  }

  return (
    <Page height="100%">
      {errorMessage && (
        <MessageBar intent="critical">{errorMessage}</MessageBar>
      )}
      <Header
        py="large"
        px={['medium', 'medium', 'large', 'large', 'xxxlarge', 'xxxlarge']}
      >
        <SpaceVertical>
          <Space align="end">
            <FieldText
              label="Find me a dashboard with..."
              value={query}
              onChange={handleChange}
              width={window.innerWidth > 768 ? '50%' : 'auto'}
            />
            <Button onClick={handleSubmit}>Go</Button>
          </Space>
          {loadingMatches && <ProgressCircular />}
          {matches.length > 0 && (
            <DashboardList
              dashboards={matches}
              selectDashboard={onDashboardSelected}
              current={selectedDashboardId}
            />
          )}
        </SpaceVertical>
      </Header>
      {selectedDashboardId && (
        <DashboardEmbed dashboardId={selectedDashboardId} />
      )}
    </Page>
  )
}

export const App = hot(AppInternal)
