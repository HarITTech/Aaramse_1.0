// Equivalent to the old NestJS HealthController @Get()
export const checkHealth = (req, res) => {
    // Simply returns 'OK' just like the old NestJS backend
    res.status(200).send('OK');
};
