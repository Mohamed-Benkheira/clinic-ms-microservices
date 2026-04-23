import consul
import os
import socket

def register_service():
    c = consul.Consul(
        host=os.getenv('CONSUL_HOST', 'clinicos_consul'),
        port=int(os.getenv('CONSUL_PORT', 8500))
    )
    c.agent.service.register(
        name='appointment-service',
        service_id='appointment-service-1',
        address=socket.gethostbyname(socket.gethostname()),
        port=8004,
        check=consul.Check.http(
            url='http://{}:8004/api/appointments/health/'.format(
                socket.gethostbyname(socket.gethostname())
            ),
            interval='10s',
            timeout='5s'
        )
    )
    print("Appointment Service registered in Consul")
