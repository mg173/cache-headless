#!/bin/bash

ps aux | grep "node index.js" | awk '{print $1}' | xargs kill -9
ps aux | grep "pupp" | awk '{print $1}' | xargs kill -9
