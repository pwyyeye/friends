<template>
  <main class="parent-page registration-page">
    <div class="card">
      <h1>{{ privacy ? "隐私说明" : "用户协议" }}</h1>
      <p class="muted">版本：2026-10-06 · 研发体验版</p>
      <template v-if="privacy"
        ><h2>收集哪些资料</h2>
        <p>
          父母账号使用手机号、加密保存的登录密码及父母称呼，孩子档案保存您主动登记的基础情况、择偶期待和照片
        </p>
        <h2>资料用于什么</h2>
        <p>
          资料用于账号登录、资料审核、今日推荐和工作人员协助牵线，邀请码仅记录邀请来源
        </p>
        <p>审核通过的孩子资料摘要可向已登录父母推荐，不展示父母手机号、完整生日或草稿，照片以模糊预览展示</p>
        <h2>谁能看到</h2>
        <p>
          您可查看自己的草稿与提交版本，授权工作人员可审核孩子资料，运营账号默认仅查看脱敏手机号，超级管理员可查看完整手机号
        </p>
        <p>孩子照片通过限时链接展示，请勿转发包含照片的内部资料链接</p>
        <h2>修改与退出</h2>
        <p>
          您可在孩子资料页面修改草稿并重新提交，退出登录后当前登录凭据失效，可在“我的”申请注销并由工作人员处理
        </p></template
      ><template v-else
        ><h2>服务内容</h2>
        <p>
          Friends
          是父母帮助成年子女相亲的平台，支持父母注册、资料登记、后台审核、今日推荐与人工牵线记录
        </p>
        <h2>登记要求</h2>
        <p>
          请使用父母本人的手机号，仅登记年满 18
          周岁且知情同意的子女，填写真实情况，上传照片前请获得孩子同意
        </p>
        <h2>资料审核</h2>
        <p>
          提交后由工作人员审核，驳回时会给出修改建议，修改草稿不会直接改变已审核通过的版本
        </p>
        <h2>服务说明</h2>
        <p>
          登记、审核和推荐不承诺匹配成功，研发体验版尚未提供直接联系、会员收费等功能
        </p></template
      ><router-link to="/register">返回登记页面</router-link>
    </div>
  </main>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
const privacy = computed(() => route.params.kind === "privacy");
</script>
