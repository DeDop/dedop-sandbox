from setuptools import setup

setup(
    name="dedopws-sandbox",
    version="0.1.0",
    description='DeDop Sandbox',
    license='GPL 3',
    author='DeDop Development Team',
    packages=['dedopws'],
    entry_points={
        'console_scripts': [
            'dedopws = dedopws.main:main',
        ]
    },
    install_requires=['falcon >= 0.3.0',
                      'CherryPy >= 3.8.0'],
)
