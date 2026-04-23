import consul
import os
import socket

def register_service():
    c = consul.Consul(
        host=os.getenv('CONSUL_HOST', 'clinicos_consul'),
        port=int(os.getenv('CONSUL_PORT', 8500))
    )
    c.agent.service.register(
        name='patient-service',
        service_id='patient-service-1',
        address=socket.gethostbyname(socket.gethostname()),
        port=8002,
        check=consul.Check.http(
            url='http://{}:8002/api/patients/health/'.format(
                socket.gethostbyname(socket.gethostname())
            ),
            interval='10s',
            timeout='5s'
        )
    )
    print("Patient Service registered in Consul")
