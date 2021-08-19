# Homebridge Family Asyst AiStrip Platform

This plugin can let you control Family Asyst AiStrip via HomeKit

## Prerequisite

1. Downlod this repo
2. Run `python3 get_token.py` and follow the instrunction to get key

## Installation

After Homebridge has been installed:

`sudo npm i -g homebridge-familyasyst-aistrip@latest`

## Config

Simple config example:

```
{
    "bridge": {
    ...
    },
    "accessories": [
    ...
    ],
    "platforms": [{
        "platform": "FamilyAsystAiStripPlatform",
        "key": "aabbccddeeff001122334455"
    }
    ]
}
```