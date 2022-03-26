#!/bin/bash

# wget to recursively download courthouses

wget -E -H -k -K -p https://getdispute.com/courthouse -r --no-parent --domains getdispute.com
