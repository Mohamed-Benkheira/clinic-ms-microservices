import consul
import os
import socket

def register_service():
    c = consul.Consul(
        host=os.getenv('CONSUL_HOST', 'clinicos_consul'),
        port=int(os.getenv('CONSUL_PORT', 8500))
    )
    c.agent.service.register(
        name='auth-service',
        service_id='auth-service-1',
        address=socket.gethostbyname(socket.gethostname()),
        port=8001,
        check=consul.Check.http(
            url='http://{}:8001/api/auth/health/'.format(
                socket.gethostbyname(socket.gethostname())
            ),
            interval='10s',
            timeout='5s'
        )
    )
    print("Auth Service registered in Consul")
