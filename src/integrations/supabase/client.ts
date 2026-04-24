const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const tableMap: Record<string, string> = {
  returns_damages: "returns",
  salary_records: "salary-records",
};

const getTableUrl = (table: string) => tableMap[table] || table;

class QueryBuilder {
  private table: string;
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private selectFields: string = "*";
  private sortField: string | null = null;
  private sortAsc: boolean = true;
  private filters: { field: string; value: any }[] = [];
  private body: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = "*") {
    this.operation = "select";
    this.selectFields = fields;
    return this;
  }

  order(field: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.sortField = field;
    this.sortAsc = ascending;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  insert(data: any) {
    this.operation = "insert";
    this.body = data;
    return this;
  }

  update(data: any) {
    this.operation = "update";
    this.body = data;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }

  private async execute() {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const endpoint = getTableUrl(this.table);
    let url = `${API_URL}/api/${endpoint}`;
    let method = "GET";
    let body: string | null = null;

    if (this.operation === "insert") {
      method = "POST";
      body = JSON.stringify(this.body);
    } else if (this.operation === "update") {
      const idFilter = this.filters.find((f) => f.field === "id");
      if (!idFilter)
        return {
          data: null,
          error: new Error('Update requires .eq("id", value)'),
        };
      url = `${API_URL}/api/${endpoint}/${idFilter.value}`;
      method = "PUT";
      body = JSON.stringify(this.body);
    } else if (this.operation === "delete") {
      const idFilter = this.filters.find((f) => f.field === "id");
      if (!idFilter)
        return {
          data: null,
          error: new Error('Delete requires .eq("id", value)'),
        };
      url = `${API_URL}/api/${endpoint}/${idFilter.value}`;
      method = "DELETE";
    }

    try {
      const res = await fetch(url, { method, headers, body });
      const data = await res.json();
      if (!res.ok)
        return {
          data: null,
          error: new Error(data.error || "Request failed"),
        };

      let result = data.data;
      if (
        this.operation === "select" &&
        this.sortField &&
        Array.isArray(result)
      ) {
        result = [...result].sort((a: any, b: any) => {
          const aVal = a[this.sortField!];
          const bVal = b[this.sortField!];
          if (aVal === null || aVal === undefined)
            return this.sortAsc ? 1 : -1;
          if (bVal === null || bVal === undefined)
            return this.sortAsc ? -1 : 1;
          if (aVal < bVal) return this.sortAsc ? -1 : 1;
          if (aVal > bVal) return this.sortAsc ? 1 : -1;
          return 0;
        });
      }

      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

const notifyAuthChange = (event: string, session: any) => {
  authListeners.forEach((cb) => cb(event, session));
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "token") {
      if (e.newValue) {
        try {
          const payload = JSON.parse(atob(e.newValue.split(".")[1]));
          notifyAuthChange("SIGNED_IN", {
            access_token: e.newValue,
            user: payload,
          });
        } catch {
          notifyAuthChange("SIGNED_OUT", null);
        }
      } else {
        notifyAuthChange("SIGNED_OUT", null);
      }
    }
  });
}

const auth = {
  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    try {
      const res = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok)
        return {
          data: { session: null, user: null },
          error: new Error(data.error || "Sign in failed"),
        };
      localStorage.setItem("token", data.session.access_token);
      notifyAuthChange("SIGNED_IN", data.session);
      return {
        data: { session: data.session, user: data.session.user },
        error: null,
      };
    } catch (err: any) {
      return { data: { session: null, user: null }, error: err };
    }
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: any;
  }) {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok)
        return { error: new Error(data.error || "Sign up failed") };
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  },

  async signOut() {
    localStorage.removeItem("token");
    notifyAuthChange("SIGNED_OUT", null);
    return { error: null };
  },

  async getSession() {
    const token = localStorage.getItem("token");
    if (!token) return { data: { session: null } };
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const session = { access_token: token, user: payload };
      return { data: { session } };
    } catch {
      localStorage.removeItem("token");
      return { data: { session: null } };
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    authListeners.add(callback);

    this.getSession().then(({ data }) => {
      if (data.session) {
        callback("INITIAL_SESSION", data.session);
      }
    });

    return {
      data: {
        subscription: {
          unsubscribe: () => authListeners.delete(callback),
        },
      },
    };
  },
};

const functions = {
  async invoke(name: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/${name}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (!res.ok)
      return {
        data: null,
        error: new Error(data.error || "Function invocation failed"),
      };
    return { data, error: null };
  },
};

const storage = {
  from(bucket: string) {
    return {
      async upload(path: string, file: File) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ file: base64, filename: path }),
        });
        const data = await res.json();
        if (!res.ok)
          return { data: null, error: new Error(data.error || "Upload failed") };
        return { data: { path }, error: null };
      },
      getPublicUrl(path: string) {
        return { data: { publicUrl: `${API_URL}/uploads/${path}` } };
      },
    };
  },
};

export const supabase: any = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth,
  functions,
  storage,
};
