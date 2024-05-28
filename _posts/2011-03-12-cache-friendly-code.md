---
layout: post
cover: false
title:  What is cache-friendly code
date:   2011-03-12 18:30:12
tags: machine
subclass: 'post tag-machine'
categories: 'hetao'
chinese: false
---

In modern computer systems, the memory hierarchy plays a crucial role in balancing performance and cost. At the top of this hierarchy are the registers, which are extremely fast but very limited in number due to their high cost. On the other end, we have DRAM, which is inexpensive but significantly slower, taking hundreds of clock cycles to access data. To bridge this gap between fast and costly registers and slow but cheap DRAM, intermediate cache memories—namely L1, L2, and L3 caches—are used. These caches progressively decrease in speed and cost, allowing frequently accessed data to be retrieved quickly, while less frequently accessed data is stored in slower, cheaper memory.

Caching works on the principle that most executing code frequently accesses a small set of variables, while a much larger set of variables is accessed infrequently. If the processor cannot find the needed data in the L1 cache, it checks the L2 cache, then the L3 cache, and finally the main memory. Each cache miss, where data is not found in the cache and must be retrieved from a lower level, incurs a significant time penalty.

This hierarchical approach is analogous to the relationship between system memory and hard disk storage: system memory is faster but more expensive, while hard disk storage is slower but much cheaper. Effective caching is essential to mitigate latency, as increasing bandwidth alone cannot solve the latency problem.

Data retrieval always follows the memory hierarchy, moving from the fastest, smallest memory to the slowest, largest memory. The performance of a system heavily depends on the cache hit rate, which refers to the frequency with which data requests are successfully served from the cache. High cache hit rates are crucial because cache misses result in slower data retrieval from RAM or, worse, the hard disk, significantly impacting performance.

In contemporary computer architectures, the main performance bottleneck is accessing memory outside the CPU die, such as RAM. This issue has become more pronounced over time, as increases in processor frequency no longer translate to significant performance gains due to memory access limitations. Consequently, modern CPU designs focus heavily on optimizing caches, prefetching data, pipeline efficiency, and concurrency. Notably, up to 85% of a CPU's die area is devoted to caches, and up to 99% for data storage and movement.

#### Key Concepts for Cache-Friendly Code

1. **Principle of Locality**:
    - **Temporal Locality**: Frequently accessed data is likely to be accessed again soon.
    - **Spatial Locality**: Data located near recently accessed data is also likely to be accessed soon.

2. **Cache Lines**:
    - Understanding cache lines is critical, as data is fetched in blocks, making contiguous memory access more efficient.

3. **Choosing Appropriate Containers**:
    - For instance, in C++, `std::vector` stores elements contiguously, enhancing cache efficiency, whereas `std::list` does not, leading to poorer cache performance.

4. **Data Structure and Algorithm Design**:
    - Techniques like cache blocking and exploiting data structure order (e.g., row-major vs. column-major ordering) are essential to optimize cache usage.

5. **Avoid Unpredictable Branches**:
    - These complicate prefetching and lead to more cache misses.

6. **Minimize Use of Virtual Functions**:
    - Virtual function calls can cause cache misses, although frequent calls might mitigate this issue.

7. **Prevent False Sharing**:
    - This occurs when multiple processors write to different variables in the same cache line, causing excessive cache coherence traffic.

### Conclusion

Efficient caching is fundamental to the performance of modern computer systems. By leveraging principles of locality, choosing appropriate data structures, and optimizing algorithms, programmers can significantly enhance their code's efficiency. Understanding and addressing common caching issues, such as false sharing and unpredictable branches, further helps in achieving optimal performance.
