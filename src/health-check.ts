export const healthCheck = {
    path: '/health-check',
    method: ['GET'],
    handler: (req, res) => {
        res.writeHead(200);
        res.end('Slack game room app alive!' + process.env.STAGE);
    },
}

export const helloThereHealthCheck = {
    path: '/hello-there',
    method: ['GET'],
    handler: (req, res) => {
        res.writeHead(200);
        res.end('Slack game room app alive!' + process.env.STAGE);
    },
}