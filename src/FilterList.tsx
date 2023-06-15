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

import React, { useContext, useMemo } from 'react'
import { Button, DialogLayout, Drawer, Fieldset } from '@looker/components'
import { FilterList as FilterListIcon } from '@styled-icons/material'
import type { LookerEmbedDashboard } from '@looker/embed-sdk'
import { ExtensionContext } from '@looker/extension-sdk-react'
import { DashboardFilter, FilterCollection } from '@looker/filter-components'
import type { IDashboardFilter } from '@looker/sdk'
import { HeaderButtons } from './HeaderButtons'

export interface FilterListProps {
  /**
   * The filter objects on the dashboard, including field, config, etc
   * with default values, not latest values
   */
  filters?: IDashboardFilter[]
  embedDashboard?: LookerEmbedDashboard
  /**
   * The latest filter values from the embed events
   */
  filterValues: { [key: string]: string }
  /**
   * The run button state from the embed
   */
  needsUpdate: boolean
}

export const FilterList = ({
  embedDashboard,
  filters = [],
  filterValues,
  needsUpdate,
}: FilterListProps) => {
  const { core40SDK } = useContext(ExtensionContext)

  const getChangeHandler = (name?: string) => (expression: string) => {
    if (name && filterValues[name] !== expression) {
      // Update filters on the embedded dashboard
      embedDashboard?.updateFilters({ [name]: expression })
    }
  }

  const update = () => {
    // Run the embedded dashboard
    embedDashboard?.run()
  }

  const sortedFilters = useMemo(
    () =>
      filters.sort((filterA, filterB) =>
        (filterA?.row || 0) > (filterB.row || 0) ? 1 : -1
      ),
    [filters]
  )

  if (sortedFilters.length === 0) return null

  return (
    <Drawer
      content={
        <DialogLayout
          header="Filters"
          headerDetail={
            <HeaderButtons needsUpdate={needsUpdate} update={update} />
          }
        >
          <FilterCollection sdk={core40SDK}>
            <Fieldset>
              {sortedFilters.map(filter =>
                filter.id ? (
                  <DashboardFilter
                    key={filter.id}
                    filter={filter}
                    onChange={getChangeHandler(filter.name || undefined)}
                    expression={filter?.name ? filterValues[filter?.name] : ''}
                  />
                ) : null
              )}
            </Fieldset>
          </FilterCollection>
        </DialogLayout>
      }
    >
      <Button iconBefore={<FilterListIcon />}>Filter</Button>
    </Drawer>
  )
}
