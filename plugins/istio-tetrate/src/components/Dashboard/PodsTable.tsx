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
import { Table, TableColumn } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { kubernetesApiRef } from '@backstage/plugin-kubernetes';
import { Dialog, DialogContent } from '@material-ui/core';

const PodsColumns: TableColumn[] = [
  { title: 'Name', field: 'name' },
  { title: 'Istio injected', field: 'istioInjection' },
  { title: 'Pods Running', field: 'podsRunning' },
  { title: 'Pods with Sidecar', field: 'podsWithSidecar' },
];

const formatReady = (pod: any) => {
  const containers = pod.status.containerStatuses;
  if (!containers) return '';

  const readyContainers = containers.filter(
    container => container.ready,
  ).length;
  const totalContainers = containers.length;

  return `${readyContainers}/${totalContainers}`;
};

const formatAge = (timestamp: string) => {
  const now = new Date();
  const created = new Date(timestamp);
  const diff = now.getTime() - created.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days}d`;
};

const fetchPodsData = async (
  namespace: string,
  k8s: any,
  clusterName: string,
) => {
  const response = await k8s.proxy({
    clusterName,
    path: `/api/v1/namespaces/${namespace}/pods`,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message);
  }

  return data.items;
};

const PodsTable = ({
  namespaces,
  selectedCluster,
}: {
  namespaces: any[];
  selectedCluster: string;
}) => {
  const k8s = useApi(kubernetesApiRef);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(
    null,
  );
  const [selectedPods, setSelectedPods] = useState<any[]>([]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const promises = namespaces.map(ns =>
        fetchPodsData(ns.metadata.name, k8s, selectedCluster),
      );
      const podsDataList = await Promise.all(promises);

      const updatedTableData = namespaces.map((ns, index) => {
        const podsData = podsDataList[index];
        const runningPods = podsData.filter(
          pod => pod.status.phase === 'Running',
        ).length;
        const podsWithSidecar = podsData.filter(
          pod => pod.spec.containers.length > 1,
        ).length;

        return {
          name: ns.metadata.name,
          istioInjection: ns.metadata.labels?.['istio-injection'] || 'disabled',
          podsRunning: runningPods,
          podsWithSidecar,
        };
      });

      setTableData(updatedTableData);
    };

    fetchData();
  }, [namespaces, k8s, selectedCluster]);

  // Function to handle row click and show pods
  const handleRowClick = async (namespace: string) => {
    const namespacePods = await fetchPodsData(namespace, k8s, selectedCluster);
    setSelectedNamespace(namespace);
    setSelectedPods(namespacePods);
  };

  // Function to close the Pods dialog
  const handleClosePodsDialog = () => {
    setSelectedNamespace(null);
    setSelectedPods([]);
  };

  return (
    <div>
      <Table
        columns={PodsColumns}
        data={tableData || []}
        components={{
          Row: ({ index }) => (
            <tr
              key={index}
              onClick={() => handleRowClick(namespaces[index].metadata.name)}
            >
              <td>{tableData[index] ? tableData[index].name : ''}</td>
              <td>{tableData[index] ? tableData[index].istioInjection : ''}</td>
              <td>{tableData[index] ? tableData[index].podsRunning : 0}</td>
              <td>{tableData[index] ? tableData[index].podsWithSidecar : 0}</td>
            </tr>
          ),
        }}
      />
      {/* Dialog to display the Pods */}
      <Dialog
        open={selectedNamespace !== null}
        onClose={handleClosePodsDialog}
        maxWidth="md" // Set maximum width to medium
        fullWidth // Expand to full width
      >
        <DialogContent style={{ marginBottom: '20px' }}>
          <h2>
            Pods in {selectedNamespace} namespace in {selectedCluster} cluster
          </h2>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '30%', textAlign: 'start' }}>Name</th>
                <th style={{ width: '10%', textAlign: 'start' }}>Ready</th>
                <th style={{ width: '15%', textAlign: 'start' }}>Status</th>
                <th style={{ width: '15%', textAlign: 'start' }}>Restarts</th>
                <th style={{ width: '30%', textAlign: 'start' }}>Age</th>
              </tr>
            </thead>
            <tbody>
              {selectedPods.map((pod, index) => (
                <tr key={index}>
                  <td>{pod.metadata.name}</td>
                  <td>{formatReady(pod)}</td>
                  <td>{pod.status.phase}</td>
                  <td>{pod.status.containerStatuses?.[0].restartCount}</td>
                  <td>{formatAge(pod.metadata.creationTimestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PodsTable;
