# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies required by LightGBM/XGBoost
RUN apt-get update && apt-get install -y libgomp1 && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app runs on (Hugging Face default is 7860)
EXPOSE 7860

# Define environment variable
ENV FLASK_APP=api.py

# Run the application using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "api:app"]
