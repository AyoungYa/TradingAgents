"""
数据库连接模块
使用 SQLAlchemy + SQLite（内存模式）
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
    """SQLAlchemy 声明式基类"""
    pass


# 使用内存 SQLite 避免虚拟文件系统 I/O 问题
# 生产环境应替换为文件数据库
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    echo=False,
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI 依赖注入：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db(models_module=None):
    """初始化数据库，创建所有表"""
    if models_module is not None:
        pass  # models 已在 main.py 中导入，确保注册到 Base.metadata
    Base.metadata.create_all(bind=engine)
