import requests

headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9,hi;q=0.8,mr;q=0.7',
    'content-type': 'application/json',
    'origin': 'https://velvety-treacle-871a56.netlify.app',
    'priority': 'u=1, i',
    'referer': 'https://velvety-treacle-871a56.netlify.app/',
    'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
}

json_data = {
    'email': 'gm7605@myamu.ac.in',
    'password': '111111',
}

response = requests.post('https://course-re-backend-do7r.vercel.app/api/auth/login', headers=headers, json=json_data)

# Note: json_data will not be serialized by requests
# exactly as it was in the original request.
#data = '{"email":"gm7605@myamu.ac.in","password":"111111"}'
#response = requests.post('https://course-re-backend-do7r.vercel.app/api/auth/login', headers=headers, data=data)
print(response.status_code)
print(response.json())