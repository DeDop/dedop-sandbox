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
    install_requires=['h5py >= 2.5',
                      'numpy >= 1.7',
                      'falcon >= 0.3',
                      'CherryPy >= 3.8'],
)
