/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, AppBar, Box, Typography, Grid } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { kubernetesApiRef } from '@backstage/plugin-kubernetes';
import { ClusterDropdown } from '../ClusterDropdown';
import TetrateLogo from './TetrateLogo.svg';
import PodsTable from './PodsTable';
import VSTable from './VSTable';
import GWTable from './GWTable';

const DenseTable = () => {
  const k8sApi = useApi(kubernetesApiRef);
  const [selectedCluster, setSelectedCluster] = useState('');
  const [namespaces, setNamespaces] = useState([]);
  const [value, setValue] = useState(0);
  const [error, setError] = React.useState(null);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const handleClusterChange = (cluster: string) => {
    setSelectedCluster(cluster);
  };

  useEffect(() => {
    const fetchNamespaces = async () => {
      if (selectedCluster) {
        const response = await k8sApi.proxy({
          clusterName: selectedCluster,
          path: '/api/v1/namespaces',
        });

        const data = await response.json();

        if (response.ok) {
          setNamespaces(data.items);
        } else {
          setError('Failed to fetch namespaces', data);
        }
      }
    };

    fetchNamespaces();
  }, [selectedCluster, k8sApi]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <Box p={2}>
        <Grid container alignItems="flex-start" spacing={2}>
          <Grid item xs={12}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={TetrateLogo}
                alt="Tetrate Logo"
                style={{
                  maxWidth: '200px',
                  marginRight: '16px',
                  width: '100%',
                  height: 'auto',
                }} // Added marginRight for spacing
              />
              <div>
                <Typography variant="h4">
                  Istio Monitoring Dashboard by Tetrate
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Welcome to the Istio Dashboard by Tetrate. This tool enables
                  you to swiftly access pods from your chosen Kubernetes
                  cluster, verify sidecar injections, and view Virtual Service
                  and Gateway configurations. Dive into the details of your
                  service mesh, ensuring optimum deployment and performance. For
                  more insights and support, join our vibrant community at
                  https://tetr8.io/tetrate-community.
                </Typography>
                <ClusterDropdown onChange={handleClusterChange} />
              </div>
            </div>
          </Grid>
        </Grid>
      </Box>

      <AppBar position="static">
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Pods" />
          <Tab label="Virtual Services" />
          <Tab label="Gateways" />
        </Tabs>
      </AppBar>
      {value === 0 && namespaces ? (
        <PodsTable
          key={`pods-${selectedCluster}`}
          namespaces={namespaces}
          selectedCluster={selectedCluster}
        />
      ) : null}
      {value === 1 ? (
        <VSTable
          key={`vs-${selectedCluster}`}
          selectedCluster={selectedCluster}
        />
      ) : null}
      {value === 2 ? (
        <GWTable
          key={`gw-${selectedCluster}`}
          selectedCluster={selectedCluster}
        />
      ) : null}
    </div>
  );
};

export default DenseTable;
