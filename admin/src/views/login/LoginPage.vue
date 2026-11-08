<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">Friends</h1>
        <p class="login-sub">父母帮子女相亲 · 管理后台</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入管理员账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          class="submit"
          :loading="loading"
          @click="onSubmit"
        >
          登录
        </el-button>
      </el-form>

      <div class="login-tip muted">
        <p>测试账号：</p>
        <p><code>admin / Admin@123</code>（超级管理员）</p>
        <p><code>operator1 / Operator@123</code>（运营）</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import { post } from "@/api/request";
import { useAuthStore } from "@/store/auth";

const router = useRouter();
const auth = useAuthStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ username: "", password: "" });

const rules: FormRules = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const onSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    loading.value = true;
    try {
      const res = await post<{
        accessToken: string;
        admin: {
          id: string;
          username: string;
          role: "super_admin" | "operator";
        };
      }>("/api/v1/admin/auth/login", form);
      auth.setAuth(res.accessToken, res.admin);
      ElMessage.success("登录成功");
      router.push("/");
    } catch (err) {
      // 业务/HTTP 错误已被 request.ts 拦截器用 ElMessage 弹窗，这里只阻止 unhandled
      console.error("admin login failed", err);
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1f2937;
}

.login-card {
  width: 380px;
  background: #ffffff;
  padding: 40px 32px 24px;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 1px;
}
.login-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.submit {
  width: 100%;
  margin-top: 4px;
}

.login-tip {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
  font-size: 12px;
  line-height: 1.7;
}
.login-tip code {
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  color: var(--color-text-regular);
}
</style>
