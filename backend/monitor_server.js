export async function startMonitor(SDR_URL, SDR_PORT, frequency) {
    try {
      const response = await axios.get(`${SDR_URL}:${SDR_PORT}/monitor/${frequency}`, {
        insecureHTTPParser: true
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

export async function stopMonitor(SDR_URL, SDR_PORT){
    try {
        const response = await axios.get(`${SDR_URL}:${SDR_PORT}/monitor/stop`, {
          insecureHTTPParser: true
        });
        return response.data;
    } catch (error) {
        throw new Error(error.message);
    }
}
