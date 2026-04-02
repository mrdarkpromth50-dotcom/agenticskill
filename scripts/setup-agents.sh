#!/bin/bash

# Script to set up Agent profiles and Skill definitions

echo "Setting up Agent profiles and Skill definitions..."

# Ensure the config directories exist
mkdir -p ../config/agents
mkdir -p ../config/skills

# Run the Python script to generate configurations
python3 ./generate_configs.py

if [ $? -eq 0 ]; then
  echo "Agent profiles and Skill definitions setup complete."
else
  echo "Error: Failed to setup Agent profiles and Skill definitions."
  exit 1
fi
