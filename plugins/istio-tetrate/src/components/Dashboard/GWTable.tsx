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
import { useAsync } from 'react-use';
import { Table, TableColumn } from '@backstage/core-components';
import { kubernetesApiRef } from '@backstage/plugin-kubernetes';
import { useApi } from '@backstage/core-plugin-api';
import React, { useState } from 'react';
import yaml from 'js-yaml'; // Import YAML library
import { Dialog, DialogContent } from '@material-ui/core';

const GWColumn: TableColumn[] = [
  { title: 'Name', field: 'name' },
  { title: 'Namespace', field: 'namespace' },
  { title: 'Hostname', field: 'hostname' },
  { title: 'Ports', field: 'portInfo' },
];

const fetchAllGWData = async (k8s: any, clusterName: string) => {
  const response = await k8s.proxy({
    clusterName,
    path: '/apis/networking.istio.io/v1beta1/gateways',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message);
  }
  return data.items;
};

const GWTable = ({ selectedCluster }: { selectedCluster: string }) => {
  const k8s = useApi(kubernetesApiRef);

  const [selectedYaml, setSelectedYaml] = useState<string | null>(null);

  const Data = useAsync(async () => {
    const GW = await fetchAllGWData(k8s, selectedCluster);
    return GW;
  });

  if (Data.loading) {
    return <div>Loading...</div>;
  }

  if (!Data.value || Data.value.length === 0) {
    return <div>No gateways available.</div>;
  }

  // Function to extract and join hostnames
  const extractHosts = servers =>
    servers.map(server => server.hosts.join('<br/>')).join('<br/>');

  // Function to extract and join ports
  const extractPorts = servers =>
    servers
      .map(
        server =>
          `${server.port.name} (${server.port.number}/${server.port.protocol})`,
      )
      .join('<br/>');

  // Function to render individual rows
  const renderRows = () =>
    Data.value.map((gateway, index) => (
      <tr key={`gw-${index}`}>
        <td>{gateway.metadata.name}</td>
        <td>{gateway.metadata.namespace}</td>
        <td
          dangerouslySetInnerHTML={{
            __html: extractHosts(gateway.spec.servers),
          }}
        />
        <td
          dangerouslySetInnerHTML={{
            __html: extractPorts(gateway.spec.servers),
          }}
        />
      </tr>
    ));

  // Function to handle row click
  const handleRowClick = gateway => {
    const gatewayYaml = yaml.dump(gateway); // Convert the object to YAML
    setSelectedYaml(gatewayYaml); // Set the YAML content to state
  };

  // Function to close the YAML dialog
  const handleCloseYamlDialog = () => {
    setSelectedYaml(null);
  };

  const rows = Data.value.map((gateway, index) => ({
    id: `gw-${index}`,
    gateway,
  }));

  return (
    <div>
      <Table
        columns={GWColumn}
        data={Data.value}
        components={{
          Row: ({ index }) => (
            <tr
              key={`gw-${index}`}
              onClick={() => handleRowClick(Data.value[index])}
            >
              <td>{Data.value[index].metadata.name}</td>
              <td>{Data.value[index].metadata.namespace}</td>
              <td
                dangerouslySetInnerHTML={{
                  __html: extractHosts(Data.value[index].spec.servers),
                }}
              />
              <td
                dangerouslySetInnerHTML={{
                  __html: extractPorts(Data.value[index].spec.servers),
                }}
              />
            </tr>
          ),
        }}
      />
      {/* Dialog to display the YAML */}
      <Dialog open={selectedYaml !== null} onClose={handleCloseYamlDialog}>
        <DialogContent>
          <pre>{selectedYaml}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GWTable;
