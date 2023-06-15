/*

 MIT License

 Copyright (c) 2022 Looker Data Sciences, Inc.

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

import type { Reducer } from "react";
import type { IDashboard } from "@looker/sdk";
import type { LookerEmbedDashboard } from "@looker/embed-sdk";

export type DashboardMatchAction = {
  type:
    | "LOADING_DEMO"
    | "LOAD_DASHBOARD"
    | "COMPLETE_DASHBOARDS_LOAD"
    | "FAIL_DASHBOARDS_LOAD"
    | "FAIL_TO_FIND_DASHBOARD"
    | "SET_SELECTED_DASHBOARD_ID"
    | "SET_STATE";
  payload?: Partial<DashboardMatchState>;
};

export type DashboardMatchState = {
  currentDashboard?: IDashboard;
  dashboards: IDashboard[];
  embedDashboard?: LookerEmbedDashboard;
  errorMessage: string;
  loadingDashboards: boolean;
  selectedDashboardId?: string;
};

export const initialState: DashboardMatchState = {
  currentDashboard: undefined,
  dashboards: [],
  // Used to update and get current filter values
  embedDashboard: undefined,
  errorMessage: "",
  loadingDashboards: false,
  selectedDashboardId: undefined,
};

export const reducer: Reducer<DashboardMatchState, DashboardMatchAction> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case "LOADING_DEMO":
      return {
        ...state,
        errorMessage: "",
        loadingDashboards: true,
      };
    case "COMPLETE_DASHBOARDS_LOAD":
      return {
        ...state,
        dashboards: action.payload?.dashboards || [],
        loadingDashboards: false,
      };
    case "FAIL_DASHBOARDS_LOAD":
      return {
        ...state,
        dashboards: [],
        errorMessage: "Error loading dashboards",
        loadingDashboards: false,
      };
    case "FAIL_TO_FIND_DASHBOARD":
      return {
        ...state,
        currentDashboard: undefined,
        errorMessage: "Unable to load dashboard.",
        selectedDashboardId: undefined,
      };
    case "LOAD_DASHBOARD":
      return {
        ...state,
        currentDashboard: action.payload?.currentDashboard,
        errorMessage: "",
      };
    // Handles all one-off state piece setting
    case "SET_STATE":
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};
