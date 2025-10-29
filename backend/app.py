import os
from api import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=int(os.environ.get('BACKEND_PORT', 5000)))
