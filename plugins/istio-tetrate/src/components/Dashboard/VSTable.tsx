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

const VSColumn: TableColumn[] = [
  { title: 'Name', field: 'name' },
  { title: 'Namespace', field: 'namespace' },
  { title: 'Associated Gateways', field: 'gateways' },
  { title: 'Hostnames', field: 'hostnames' },
  { title: 'Ports', field: 'ports' },
  { title: 'Destinations', field: 'destinations' },
];

const fetchAllVSData = async (k8s: any, clusterName: string) => {
  const response = await k8s.proxy({
    clusterName,
    path: '/apis/networking.istio.io/v1beta1/virtualservices',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message);
  }
  return data.items;
};

const VSTable = ({ selectedCluster }: { selectedCluster: string }) => {
  const k8s = useApi(kubernetesApiRef);

  const [selectedYaml, setSelectedYaml] = useState<string | null>(null);

  const Data = useAsync(async () => {
    const VS = await fetchAllVSData(k8s, selectedCluster);
    return VS;
  });

  const VSRows = Data.value?.map((vs, index) => {
    const ports = vs.spec.http
      .flatMap(http => http.match.map(port => port.port))
      .join(', ');
    const destinations = vs.spec.http
      .flatMap(http => http.route.map(route => route.destination.host))
      .join(', ');

    return {
      id: `vs-${index}`,
      name: vs.metadata.name,
      namespace: vs.metadata.namespace,
      gateways: vs.spec.gateways.join(', '),
      hostnames: vs.spec.hosts.join(', '),
      ports,
      destinations,
    };
  });

  // Function to handle row click
  const handleRowClick = index => {
    const vs = Data.value[index];
    const vsYaml = yaml.dump(vs); // Convert the object to YAML
    setSelectedYaml(vsYaml); // Set the YAML content to state
  };

  // Function to close the YAML dialog
  const handleCloseYamlDialog = () => {
    setSelectedYaml(null);
  };

  return (
    <div>
      <Table
        columns={VSColumn}
        data={VSRows || []}
        components={{
          Row: ({ index }) => (
            <tr key={VSRows[index].id} onClick={() => handleRowClick(index)}>
              <td>{VSRows[index].name}</td>
              <td>{VSRows[index].namespace}</td>
              <td>{VSRows[index].gateways}</td>
              <td>{VSRows[index].hostnames}</td>
              <td>{VSRows[index].ports}</td>
              <td>{VSRows[index].destinations}</td>
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

export default VSTable;
