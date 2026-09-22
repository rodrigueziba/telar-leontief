import numpy as np
np.set_printoptions(precision=4, suppress=True, linewidth=150)

def fila(v, d=4):
    return " & ".join(f"{x:.{d}f}" for x in v)

def bloque(M, d=4):
    return "\n".join("   " + fila(f, d) for f in M)

print("="*70); print("EJERCICIO 1"); print("="*70)
A1=np.array([[.2,.3],[.1,.4]]); y1=np.array([200.,150.]); I2=np.eye(2)
IA1=I2-A1; d1=np.linalg.det(IA1); L1=np.linalg.inv(IA1); x1=L1@y1
print("I-A:\n"+bloque(IA1,1)); print(f"det = {d1:.4f}")
print("L:\n"+bloque(L1)); print("x:", fila(x1))
print("Ax:", fila(A1@x1)); print("Ax+y:", fila(A1@x1+y1))
print("consumo intermedio total:", f"{(A1@x1).sum():.4f}", " prod total:", f"{x1.sum():.4f}")
print("multiplicadores:", fila(L1.sum(axis=0)))
print("rho:", f"{max(abs(np.linalg.eigvals(A1))):.4f}")
print("sumas de columna de A:", fila(A1.sum(axis=0),2))

print("="*70); print("EJERCICIO 2"); print("="*70)
L2=np.array([[1.25,.10,.05],[.20,1.40,.10],[.15,.20,1.30]])
dy2=np.array([0.,50.,0.]); dx2=L2@dy2
print("columna Transporte:", fila(L2[:,1],2)); print("dx:", fila(dx2,2))
print("total:", f"{dx2.sum():.2f}", " multiplicadores:", fila(L2.sum(axis=0)))
A2=np.eye(3)-np.linalg.inv(L2); print("A recuperada:\n"+bloque(A2))
print("rho:", f"{max(abs(np.linalg.eigvals(A2))):.4f}")

print("="*70); print("EJERCICIO 3"); print("="*70)
A3=np.array([[.1,.2,.1,0.],[.1,.3,.2,.1],[0.,.2,.2,.1],[.1,.1,.1,.2]])
y3=np.array([100.,150.,80.,120.]); I4=np.eye(4)
IA3=I4-A3; d3=np.linalg.det(IA3); L3=np.linalg.inv(IA3); x3=L3@y3
print("I-A:\n"+bloque(IA3,1)); print(f"det = {d3:.4f}")
print("L:\n"+bloque(L3)); print("x:", fila(x3))
print("Ax:", fila(A3@x3)); print("Ax+y:", fila(A3@x3+y3))
print("consumo:", f"{(A3@x3).sum():.4f}", " total:", f"{x3.sum():.4f}")
print("multiplicadores:", fila(L3.sum(axis=0)))
print("rho:", f"{max(abs(np.linalg.eigvals(A3))):.4f}")
print("sumas de columna de A:", fila(A3.sum(axis=0),2))
print("primera fila del producto L3 y:", " + ".join(f"{L3[0,j]:.4f}x{y3[j]:.0f}" for j in range(4)))

print("="*70); print("EJERCICIO 4"); print("="*70)
L4=np.array([[1.20,.10,.05,.00,.02],[.15,1.30,.10,.05,.00],[.05,.10,1.25,.10,.05],
             [.10,.15,.10,1.40,.10],[.05,.05,.05,.10,1.20]])
dy4=np.array([0.,0.,100.,0.,0.]); dx4=L4@dy4
print("columna Energia:", fila(L4[:,2],2)); print("dx:", fila(dx4,2))
print("total:", f"{dx4.sum():.2f}", " multiplicadores:", fila(L4.sum(axis=0)))
A4=np.eye(5)-np.linalg.inv(L4); print("A recuperada:\n"+bloque(A4))
neg=[(i,j,A4[i,j]) for i in range(5) for j in range(5) if A4[i,j]<-1e-9]
print("negativos:", [(i+1,j+1,round(v,4)) for i,j,v in neg])
print("rho:", f"{max(abs(np.linalg.eigvals(A4))):.4f}")
Ac=np.clip(A4,0,None); xc=np.linalg.inv(np.eye(5)-Ac)@dy4
print("x con A clampeada:", fila(xc), " desvio max:", f"{np.max(np.abs(xc-dx4)):.4f}")

print("="*70); print("CONVERGENCIA"); print("="*70)
for k,(A,y) in enumerate([(A1,y1),(A2,dy2),(A3,y3),(A4,dy4)],1):
    n=len(y); x=np.linalg.inv(np.eye(n)-A)@y; tot=x.sum()
    t=y.copy(); ap=[]
    for _ in range(60): ap.append(t.sum()); t=A@t
    ac=np.cumsum(ap)
    print(f"Ej {k}: 3 pasadas {100*ac[2]/tot:5.1f}%  6 pasadas {100*ac[5]/tot:5.1f}%  "
          f"aportes {' '.join(f'{v:.1f}' for v in ap[:6])}")
