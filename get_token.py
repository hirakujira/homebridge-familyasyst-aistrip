#!/usr/bin/python3

import hashlib
import time
import uuid
import requests

def generateHash(phoneNumber, smsCode, timestamp):
	sha = hashlib.sha256()
	data = phoneNumber + smsCode + "com.tisc.familyasyst2" + timestamp
	sha.update(data.encode("utf-8"))
	hashString = sha.hexdigest()
	return hashString

if __name__ == "__main__":
	phoneNumber = input("Please enter your phone number with country code. (Example: +886912345678)\n")
	uuid = str(uuid.uuid4()).upper()
	timestamp = str(time.time()).split(".")[0] + "000"
	hashString = generateHash(phoneNumber, "", timestamp)

	verifyUrl = "https://asia-east1.tiscservice.com/api/fa2/usr/" + phoneNumber
	response = requests.post(verifyUrl, 
		json={
			"apiLevel": -1,
			"applicationName": "智慧管家",
			"brand": "Apple",
			"deviceCountry": "TW",
			"deviceLocale": "zh-Hant-TW",
			"deviceName": "HomeBridge",
			"fcmToken": "",
			"model": "iPhone X",
			"systemName": "iOS",
			"systemVersion": "15.0",
			"timezone": "Asia/Taipei",
			"uniqueId": uuid,
			"appVersion": "1.6.4",
			"bundleId": "com.tisc.familyasyst2",
			"deviceType": "Handset",
			"iid": "",
			"provider": "phone",
			"h": hashString,
			"os": "ios",
			"t": int(timestamp)
		})

	if (response.status_code != 200) or response.json()["ok"] != True:
		print("Invalid response! Please try again")
		print(response.json())
		exit(0)

	smsCode = input("Please enter received SMS code. \n")
	timestamp = str(time.time()).split(".")[0] + "000"
	hashString = generateHash(phoneNumber, smsCode, timestamp)

	response = requests.post(verifyUrl, 
		json={
			"smsCode": smsCode,
			"h": hashString,
			"os": "ios",
			"t": int(timestamp),
			"brand": "Apple",
			"model": "iPhone X",
			"uniqueId": uuid,
			"fcmToken": ""
		})

	if (response.status_code != 200) or response.json()["ok"] != True:
		print("Invalid response! Please try again")
		print(response.json())
		exit(0)

	print("Your key is :\n")
	print(response.json()["key"])