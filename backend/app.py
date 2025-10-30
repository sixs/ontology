import os
from dotenv import load_dotenv
from api import create_app

# 加载.env文件
load_dotenv()

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=int(os.environ.get('BACKEND_PORT', 5000)))
