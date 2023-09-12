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
import React, { useEffect, useState } from 'react';
import {
  useApi,
  configApiRef,
  discoveryApiRef,
} from '@backstage/core-plugin-api';
import yaml from 'js-yaml';

interface ClusterDropdownProps {
  onChange: (selectedCluster: string) => void;
}

const ClusterDropdown: React.FC<ClusterDropdownProps> = ({ onChange }) => {
  const [error, setError] = React.useState(null);
  const [clusters, setClusters] = useState<string[]>([]);

  const configApi = useApi(configApiRef);

  useEffect(() => {
    try {
      // Retrieve configuration using configApi
      const clusterLocatorMethods = configApi.getOptional(
        'kubernetes.clusterLocatorMethods',
      );
      if (
        clusterLocatorMethods &&
        clusterLocatorMethods[0] &&
        clusterLocatorMethods[0].clusters
      ) {
        const clusterNames = clusterLocatorMethods[0].clusters.map(
          cluster => cluster.name,
        );
        setClusters(clusterNames);
      }
    } catch (err) {
      setError('Error retrieving configuration:', err);
    }
  }, [configApi]);

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCluster = event.target.value;
    onChange(selectedCluster);
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <p style={{ margin: 0, marginRight: '8px' }}>
        Select a Kubernetes Cluster
      </p>
      <select onChange={handleSelect}>
        <option value="">--Please choose a cluster--</option>
        {clusters.map(cluster => (
          <option key={cluster} value={cluster}>
            {cluster}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClusterDropdown;
