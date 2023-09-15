#!/bin/bash

# Optional: Log environment variables for troubleshooting
env > /tmp/yarnapp_env.log

kubectl config view

# Run your original command
/usr/bin/yarn dev

