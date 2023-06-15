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

import React, { useContext, useEffect, useState, useReducer } from "react";
import { hot } from "react-hot-loader/root";
import {
  Box,
  MessageBar,
  Header,
  Heading,
  Page,
  Space,
  SpaceVertical,
  Spinner,
  FieldText,
} from "@looker/components";
import type { LookerEmbedDashboard } from "@looker/embed-sdk";
import { ExtensionContext } from "@looker/extension-sdk-react";
import { i18nInit } from "@looker/filter-components";
import type { IDashboard } from "@looker/sdk";
import { useLocation, useHistory } from "react-router-dom";
import { DashboardList } from "./DashboardList";
import { DashboardEmbed } from "./DashboardEmbed";
import { reducer, initialState } from "./state";

const i18nPromise = i18nInit();

const AppInternal = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    currentDashboard,
    dashboards,
    // embedDashboard,
    errorMessage,
    loadingDashboards,
    selectedDashboardId,
  } = state;

  const { core40SDK } = useContext(ExtensionContext);
  const horizontal = window.innerWidth > 768;
  const HeaderSpace = horizontal ? Space : SpaceVertical;

  useEffect(() => {
    dispatch({
      type: "LOADING_DEMO",
    });
    const loadDashboards = async () => {
      try {
        const result = (await core40SDK.ok(
          core40SDK.all_dashboards()
        )) as IDashboard[];

        dispatch({
          payload: {
            dashboards: result.sort(
              ({ title: aTitle = "" }, { title: bTitle = "" }) =>
                (aTitle as string).localeCompare(bTitle as string)
            ),
          },
          type: "COMPLETE_DASHBOARDS_LOAD",
        });
      } catch (error) {
        dispatch({
          type: "FAIL_DASHBOARDS_LOAD",
        });
      }
    };
    loadDashboards();
  }, [core40SDK]);

  const { pathname } = useLocation();
  const history = useHistory();
  useEffect(() => {
    if (dashboards && dashboards.length > 0) {
      // Get the dashboard ID from the location
      const path: string[] = pathname.split("/");
      let id: string | undefined;
      if (path.length > 1 && path[1] !== "") {
        id = path[1];
      }
      if (id && id !== selectedDashboardId) {
        dispatch({ payload: { selectedDashboardId: id }, type: "SET_STATE" });
      }
    }
  }, [dashboards, history, pathname, selectedDashboardId]);

  useEffect(() => {
    const dashboard = (dashboards || []).find(
      (d) => d.id === selectedDashboardId
    );
    const loadDashboard = async (id: string) => {
      const result = (await core40SDK.ok(
        core40SDK.dashboard(id)
      )) as IDashboard;
      dispatch({ payload: { currentDashboard: result }, type: "SET_STATE" });
    };
    // If no matching Dashboard then return
    if (selectedDashboardId && dashboard === undefined) {
      dispatch({ type: "FAIL_TO_FIND_DASHBOARD" });
    } else {
      dispatch({
        payload: { currentDashboard: dashboard },
        type: "LOAD_DASHBOARD",
      });
      if (selectedDashboardId) {
        loadDashboard(selectedDashboardId);
      }
    }
  }, [core40SDK, dashboards, selectedDashboardId]);

  const onDashboardSelected = (id: string) => {
    if (!currentDashboard || currentDashboard.id !== id) {
      // Update the id in the URL. This will trigger the useEffects
      // which will load the dashboard
      history.push("/" + id);
    }
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    i18nPromise.then(() => {
      setReady(true);
    });
  }, []);

  if (!ready) return <Spinner />;

  return (
    <Page height="100%">
      {errorMessage && (
        <MessageBar intent="critical">{errorMessage}</MessageBar>
      )}
      <Header
        py="large"
        px={["medium", "medium", "large", "large", "xxxlarge", "xxxlarge"]}
      >
        <HeaderSpace>
          <FieldText label="I'm looking for a dashboard that:" />
          <Box flexShrink={0}>
            <Heading as="h4">Recommended Dashboard:</Heading>
          </Box>
          <DashboardList
            dashboards={dashboards}
            loading={loadingDashboards}
            selectDashboard={onDashboardSelected}
            current={currentDashboard?.id}
          />
        </HeaderSpace>
      </Header>
      {currentDashboard?.id && (
        <DashboardEmbed
          dashboardId={currentDashboard.id}
          setEmbedDashboard={(embedDashboard: LookerEmbedDashboard) =>
            dispatch({ payload: { embedDashboard }, type: "SET_STATE" })
          }
        />
      )}
    </Page>
  );
};

export const App = hot(AppInternal);
