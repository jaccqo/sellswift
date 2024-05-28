import platform

import time
import numba

def get_cpu_serial_number():
    if platform.system() == 'Windows':
        # For Windows, you can use the WMI module
        import wmi
        w = wmi.WMI()
        for processor in w.Win32_Processor():
            return processor.ProcessorId.strip()



# Define a heavy computation function and decorate with @jit
@numba.jit
def heavy_computation_numba(n):
    result = 0
    for i in range(n):
        result += i * i
        print(result)
    return result


# Define a heavy computation function
def heavy_computation(n):
    result = 0
    for i in range(n):
        result += i * i
        print(result)
       
    return result

#Measure the time taken for computation
# start_time = time.time()
# result_normal = heavy_computation(1000000000000000000)
# end_time = time.time()

# print("Normal Python Computation Result:", result_normal)
# print("Time taken (Normal Python):", end_time - start_time, "seconds")

#Measure the time taken for computation
start_time = time.time()
result_numba = heavy_computation_numba(1000000000000000000)
end_time = time.time()

print("Numba Computation Result:", result_numba)
print("Time taken (Numba):", end_time - start_time, "seconds")
