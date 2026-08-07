import urllib.request
import os
import sys

def download_file(url, target_path):
    print(f"Downloading {url} -> {target_path} ...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp, open(target_path, 'wb') as out_file:
            total_length = resp.getheader('Content-Length')
            if total_length:
                total_bytes = int(total_length)
                print(f"File size: {total_bytes / (1024*1024):.2f} MB")
            
            downloaded = 0
            block_size = 1024 * 1024  # 1MB
            while True:
                buffer = resp.read(block_size)
                if not buffer:
                    break
                downloaded += len(buffer)
                out_file.write(buffer)
                if total_length:
                    percent = (downloaded / total_bytes) * 100
                    print(f"Progress: {percent:.1f}% ({downloaded / (1024*1024):.1f} MB)", end='\r')
        print(f"\nSuccessfully downloaded: {target_path} ({os.path.getsize(target_path) / (1024*1024):.2f} MB)")
        return True
    except Exception as e:
        print(f"\nFailed to download {url}: {e}")
        return False

def main():
    os.makedirs('data/india', exist_ok=True)
    
    urls = [
        ("https://huggingface.co/datasets/muhammetakkurt/naukri-jobs-dataset/resolve/main/naukri_software_engineer.jsonl", "data/india/naukri_software_engineer.jsonl"),
        ("https://huggingface.co/datasets/muhammetakkurt/naukri-jobs-dataset/resolve/main/naukri_data_scientist.jsonl", "data/india/naukri_data_scientist.jsonl"),
        ("https://raw.githubusercontent.com/chetanambi/Predict-The-Data-Scientists-Salary-In-India-Hackathon/master/Final_Train_Dataset.csv", "data/india/ds_salary_india.csv"),
    ]

    for url, path in urls:
        if not os.path.exists(path) or os.path.getsize(path) < 1000:
            download_file(url, path)
        else:
            print(f"Found existing {path} ({os.path.getsize(path)/(1024*1024):.2f} MB)")

if __name__ == '__main__':
    main()
