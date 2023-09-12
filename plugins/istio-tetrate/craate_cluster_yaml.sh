#!/bin/bash

output_file_name=kubernetes.yaml
# Initialize YAML file
echo "kubernetes:" > "$output_file_name"
echo "  serviceLocatorMethod:" >> "$output_file_name"
echo "    type: 'multiTenant'" >> "$output_file_name"
echo "  clusterLocatorMethods:" >> "$output_file_name"
echo "    - type: 'config'" >> "$output_file_name"
echo "      clusters:" >> "$output_file_name"

clusters=$(kubectl config view -o json | jq -r '.clusters[] | "\(.name) \(.cluster.server)"')

echo "$clusters" | while read -r line; do
  unset full_cluster_name short_cluster_name server context_name control_plane
  
  full_cluster_name=$(echo "$line" | awk '{print $1}')
  server=$(echo "$line" | awk '{print $2}')

  # If the server matches EKS URL pattern
  if [[ $server == *eks.amazonaws.com* ]]; then
    
    # Check if the name starts with "arn:"
    echo $full_cluster_name
    if [[ $full_cluster_name == arn:* ]]; then
      short_cluster_name="$full_cluster_name"
    else
      # Remove prefix up to and including '@' if exists
      short_cluster_name=${full_cluster_name#*@}
      
      # Remove everything from the first '.' to the end
      short_cluster_name=${short_cluster_name%%.*}
    fi
echo $short_cluster_name
    
    # If no '@' or 'arn:', set short_cluster_name as empty.
    # [[ $short_cluster_name == $full_cluster_name ]] && unset short_cluster_name
    # If short_cluster_name exists, continue.
    if [ -n "$short_cluster_name" ]; then
      context_name=$(kubectl config get-contexts --output=name | grep "$short_cluster_name")

      if [ -n "$context_name" ]; then
        control_plane=$(kubectl cluster-info --context "$context_name" | grep "Kubernetes control plane" | awk -F'at ' '{print $2}' | sed 's/\x1b\[[0-9;]*m//g')
        echo "Success: context found for cluster $short_cluster_name"
        echo "Control plane: $control_plane"
      else
        echo "Warning: No context found for cluster $short_cluster_name"
      fi
    
      if [ -n "$control_plane" ]; then
        echo "        - url: $control_plane" >> "$output_file_name"
        echo "          name: $short_cluster_name" >> "$output_file_name"
        echo "          skipTLSVerify: true" >> "$output_file_name"
        echo "          authProvider: 'aws'" >> "$output_file_name"
        echo "          skipMetricsLookup: true" >> "$output_file_name"
      else
        echo "Warning: No control plane found for cluster $short_cluster_name"
      fi
    fi
  fi
done
