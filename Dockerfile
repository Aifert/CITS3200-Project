FROM python:3.10

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment variables
ENV FLASK_APP=src/app.py
ENV FLASK_ENV=development

CMD ["flask", "--debug", "run"]
