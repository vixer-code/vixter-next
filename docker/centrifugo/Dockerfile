FROM centrifugo/centrifugo:v5

# Copy configuration
COPY config.json /centrifugo/config.json

# Expose port
EXPOSE 8000

# Run Centrifugo
CMD ["centrifugo", "--config=/centrifugo/config.json"]
